#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsyStackedCardsModel<Item: Identifiable> {
    var items: [Item]

    init(items: [Item]) {
      self.items = items
    }
  }

  private struct HugsyStackedCardsHost<Item: Identifiable>: View {
    @Bindable var model: HugsyStackedCardsModel<Item>
    let visibleCount: Int
    let cardHeight: CGFloat
    let card: (Item) -> UIView
    let onCycle: @MainActor (Item) -> Void

    var body: some View {
      HugsyStackedCards(
        items: $model.items, visibleCount: visibleCount, cardHeight: cardHeight, onCycle: onCycle
      ) { item in
        HugsyUIViewBox(card(item))
      }
    }
  }

  private struct HugsyStackedCardsKey: Hashable {
    let id: AnyHashable
  }

  public final class HugsyStackedCardsViewController<Item: Identifiable>: UIViewController {
    public var didCycle: ((Item) -> Void)?
    public var items: [Item] {
      get { model.items }
      set {
        model.items = newValue
        cache.retain(Set(newValue.map(Self.key)))
      }
    }
    private let model: HugsyStackedCardsModel<Item>
    private let visibleCount: Int
    private let cardHeight: CGFloat
    private let cardView: (Item) -> UIView
    private let cache = HugsyUIViewCache()

    public init(
      items: [Item], visibleCount: Int = 3, cardHeight: CGFloat = 200,
      cardView: @escaping (Item) -> UIView
    ) {
      self.model = HugsyStackedCardsModel(items: items)
      self.visibleCount = visibleCount
      self.cardHeight = cardHeight
      self.cardView = cardView
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    private static func key(_ item: Item) -> AnyHashable {
      AnyHashable(HugsyStackedCardsKey(id: AnyHashable(item.id)))
    }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsyStackedCardsHost(
          model: model, visibleCount: visibleCount, cardHeight: cardHeight,
          card: { [unowned self] item in
            cache.view(for: Self.key(item)) { cardView(item) }
          },
          onCycle: { [unowned self] item in
            cache.retain(Set(model.items.map(Self.key)))
            didCycle?(item)
          }))
    }
  }
#endif
