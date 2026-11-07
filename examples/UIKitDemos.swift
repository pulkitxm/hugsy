#if os(iOS)
  import SwiftUI
  import UIKit

  #if SWIFT_PACKAGE
    import Hugsy
  #endif

  struct UIKitDemo: UIViewControllerRepresentable {
    let demo: GalleryDemo

    func makeUIViewController(context: Context) -> UIViewController {
      let controller = UIKitDemoViewController(demo: demo)
      return controller
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
  }

  final class UIKitDemoViewController: UIViewController {
    private let demo: GalleryDemo

    init(demo: GalleryDemo) {
      self.demo = demo
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .systemBackground
      let child = makeComponent()
      addChild(child)
      child.view.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview(child.view)
      NSLayoutConstraint.activate([
        child.view.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
        child.view.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
        child.view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
        child.view.bottomAnchor.constraint(
          equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
      ])
      child.didMove(toParent: self)
    }

    private func makeComponent() -> UIViewController {
      switch demo {
      case .swipeDeck:
        HugsySwipeDeckViewController(items: DemoCard.samples) { Self.cardView($0) }
      case .parallaxCarousel:
        HugsyParallaxCarouselViewController(items: DemoCard.samples) { Self.cardView($0) }
      case .morphingCapsule:
        HugsyMorphingCapsuleViewController { phase in
          let label = UILabel()
          label.text = phase == .expanded ? "Morning mix" : phase == .alert ? "Saved" : "2:14"
          label.textColor = .white
          label.textAlignment = .center
          label.font = .preferredFont(forTextStyle: phase == .expanded ? .title2 : .footnote)
          return label
        }
      case .expandingCards:
        HugsyExpandingCardsViewController(items: Array(DemoCard.samples.prefix(3))) { card, _ in
          Self.cardView(card)
        }
      case .radialMenu:
        HugsyRadialMenuViewController(actions: [
          .init(id: "photo", title: "Add photo", symbol: "camera") {},
          .init(id: "note", title: "New note", symbol: "square.and.pencil") {},
          .init(id: "link", title: "Save link", symbol: "link") {},
        ])
      case .stackedCards:
        HugsyStackedCardsViewController(items: Array(DemoCard.samples.prefix(3))) { card in
          Self.cardView(card)
        }
      }
    }

    private static func cardView(_ card: DemoCard) -> UIView {
      let view = UIView()
      view.backgroundColor = UIColor(hue: card.hue, saturation: 0.5, brightness: 0.8, alpha: 1)
      let label = UILabel()
      label.text = card.title
      label.font = .systemFont(ofSize: 28, weight: .semibold)
      label.textColor = .white
      label.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview(label)
      NSLayoutConstraint.activate([
        label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
        label.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -24),
      ])
      return view
    }
  }
#endif
