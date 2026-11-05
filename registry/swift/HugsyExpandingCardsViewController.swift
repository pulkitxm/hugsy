#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsyExpandingCardsModel<Item: Identifiable> {
    var items: [Item]
    var selection: Item.ID?

    init(items: [Item], selection: Item.ID?) {
      self.items = items
      self.selection = selection
    }
  }

  private struct HugsyExpandingCardsHost<Item: Identifiable>: View {
    let model: HugsyExpandingCardsModel<Item>
    let cardHeight: CGFloat
    let expandedHeight: CGFloat
    let card: (Item, Bool) -> UIView
    let onSelect: (Item.ID?) -> Void

    var body: some View {
      HugsyExpandingCards(
        items: model.items,
        selection: Binding(
          get: { model.selection },
          set: { value in
            model.selection = value
            onSelect(value)
          }), cardHeight: cardHeight, expandedHeight: expandedHeight
      ) { item, expanded in
        HugsyUIViewBox(card(item, expanded))
      }
    }
  }

  private struct HugsyCardKey: Hashable {
    let id: AnyHashable
    let expanded: Bool
  }

  public final class HugsyExpandingCardsViewController<Item: Identifiable>: UIViewController {
    public var didSelect: ((Item.ID?) -> Void)?
    public var items: [Item] {
      get { model.items }
      set {
        model.items = newValue
        cache.retain(Set(newValue.flatMap { [Self.key($0, false), Self.key($0, true)] }))
      }
    }
    public var selection: Item.ID? {
      get { model.selection }
      set { model.selection = newValue }
    }
    private let model: HugsyExpandingCardsModel<Item>
    private let cardHeight: CGFloat
    private let expandedHeight: CGFloat
    private let cardView: (Item, Bool) -> UIView
    private let cache = HugsyUIViewCache()

    public init(
      items: [Item], selection: Item.ID? = nil, cardHeight: CGFloat = 180,
      expandedHeight: CGFloat = 440, cardView: @escaping (Item, Bool) -> UIView
    ) {
      self.model = HugsyExpandingCardsModel(items: items, selection: selection)
      self.cardHeight = cardHeight
      self.expandedHeight = expandedHeight
      self.cardView = cardView
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    private static func key(_ item: Item, _ expanded: Bool) -> AnyHashable {
      AnyHashable(HugsyCardKey(id: AnyHashable(item.id), expanded: expanded))
    }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsyExpandingCardsHost(
          model: model, cardHeight: cardHeight, expandedHeight: expandedHeight,
          card: { [unowned self] item, expanded in
            cache.view(for: Self.key(item, expanded)) { cardView(item, expanded) }
          },
          onSelect: { [unowned self] value in didSelect?(value) }))
    }
  }
#endif
